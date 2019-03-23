https://github.com/fritzlabs/fritz-models/tree/master/style_transfer

Need to download dataset images, run create_training_dataset.py which is then placed in: style_transfer/data/val2017/training_images.tfrecord

If you get ImportError no module named style_tranfer, then:
export PYTHONPATH=$PYTHONPATH:`pwd`

train model:

python style_transfer/train.py --training-image-dset example/training_images.tfrecord --style-images /path/to/image.jpg --model-checkpoint /path/to/model.h5 --image-size 256,256 --alpha 0.25 --log-interval 1 --num-iterations 20


transfer style:

python stylize_image.py --input-image /path/to/image.jpg --output-image /path/to/output_image.jpg --model-checkpoint /path/to/model.h5
